
from setuptools import find_packages, setup
from typing import List

def get_requirements(file_path: str) -> List[str]:
    '''
    This will return list of requirements
    '''
    requirement_list: List[str] = []
    try:
        with open(file_path, 'r') as file:
            lines = file.readlines()
            for line in lines:
                requirement = line.strip()
                if requirement and requirement != '-e .':
                    requirement_list.append(requirement)

    except FileNotFoundError:
        print("requirements.txt file not found")

    return requirement_list


setup(
    name='Smart Medical System',
    version='0.0.1',
    author='Bidipta Mallik',
    author_email='bidiptamallik0@gmail.com',
    package_dir={'': 'backend'},
    packages=find_packages(where='backend'),
    install_requires=get_requirements('requirements.txt')
)